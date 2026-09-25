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
