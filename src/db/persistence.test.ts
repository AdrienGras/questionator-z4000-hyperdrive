import 'fake-indexeddb/auto'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

type Storage = { persisted?: () => Promise<boolean>; persist?: () => Promise<boolean> }

function stubStorage(storage: Storage | undefined) {
  vi.stubGlobal('navigator', Object.assign({}, window.navigator, { storage }))
}

async function load() {
  return import('./persistence')
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('usePersistenceStatus', () => {
  test('persisted', async () => {
    stubStorage({ persisted: async () => true, persist: async () => true })
    const { usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    await waitFor(() => expect(result.current).toBe('persisted'))
  })

  test('best-effort', async () => {
    stubStorage({ persisted: async () => false, persist: async () => false })
    const { usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    await waitFor(() => expect(result.current).toBe('best-effort'))
  })

  test('unsupported sans API, et requestPersistentStorage renvoie false', async () => {
    stubStorage(undefined)
    const { requestPersistentStorage, usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    await waitFor(() => expect(result.current).toBe('unsupported'))
    expect(await requestPersistentStorage()).toBe(false)
  })

  test('persisted() qui rejette : best-effort, sans rejet non géré', async () => {
    stubStorage({ persisted: () => Promise.reject(new Error('refus')), persist: async () => false })
    const { usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    await waitFor(() => expect(result.current).toBe('best-effort'))
  })
})

describe('refresh() hors ordre', () => {
  test('un premier refresh() résolu tardivement n’écrase pas un statut plus récent', async () => {
    let resolveFirstPersisted: ((persisted: boolean) => void) | undefined
    let callCount = 0
    const persisted = vi.fn<() => Promise<boolean>>(() => {
      callCount += 1
      // Le premier appel (déclenché par l'abonnement) reste en attente ; le second (déclenché
      // par requestPersistentStorage) se résout tout de suite, avant lui.
      if (callCount === 1) {
        return new Promise<boolean>((resolve) => {
          resolveFirstPersisted = resolve
        })
      }
      return Promise.resolve(true)
    })
    stubStorage({ persisted, persist: async () => true })
    const { requestPersistentStorage, usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())

    await requestPersistentStorage()
    await waitFor(() => expect(result.current).toBe('persisted'))
    expect(callCount).toBe(2)

    // Le premier refresh() se résout maintenant avec un statut périmé ('best-effort') ; sans
    // compteur de séquence il écraserait le 'persisted' déjà posé par le second.
    expect(resolveFirstPersisted).toBeDefined()
    resolveFirstPersisted?.(false)
    for (let tick = 0; tick < 5; tick += 1) await Promise.resolve()

    expect(result.current).toBe('persisted')
  })
})

describe('requestPersistentStorage', () => {
  test('une demande acceptée fait passer le hook de best-effort à persisted', async () => {
    let granted = false
    const persist = vi.fn<() => Promise<boolean>>(async () => {
      granted = true
      return true
    })
    stubStorage({ persisted: async () => granted, persist })
    const { requestPersistentStorage, usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    await waitFor(() => expect(result.current).toBe('best-effort'))

    expect(await requestPersistentStorage()).toBe(true)
    expect(persist).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(result.current).toBe('persisted'))
  })

  test('une demande refusée renvoie false et laisse best-effort', async () => {
    stubStorage({ persisted: async () => false, persist: async () => false })
    const { requestPersistentStorage, usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    expect(await requestPersistentStorage()).toBe(false)
    await waitFor(() => expect(result.current).toBe('best-effort'))
  })
})
