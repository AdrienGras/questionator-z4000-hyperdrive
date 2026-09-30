import 'fake-indexeddb/auto'
import { act, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import type { DbStatus } from '@/lib/db/db'
import { pwaUpdate, type PwaUpdate } from '@/lib/pwa/pwa-update'
import { makeFakeContainer } from '@/testing/pwa-fixtures'
import { renderAt } from '@/testing/render-at'

// Le singleton est remplacé par une instance neuve à chaque test : aucune fuite d'état.
const pwa = vi.hoisted(() => ({ current: undefined as PwaUpdate | undefined }))
vi.mock('@/lib/pwa/pwa-update', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/pwa/pwa-update')>()
  return {
    ...actual,
    get pwaUpdate() {
      pwa.current ??= new actual.PwaUpdate(() => undefined)
      return pwa.current
    },
  }
})

// Vrai `useReloadOnUpdate`, rechargement espion (jsdom n'implémente pas `location.reload`).
const reload = vi.hoisted(() => vi.fn<() => void>())
vi.mock('@/lib/pwa/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/pwa/hooks')>()
  return {
    ...actual,
    useReloadOnUpdate: (dbOutdated: boolean, update?: PwaUpdate) =>
      actual.useReloadOnUpdate(dbOutdated, update, reload),
  }
})

const db = vi.hoisted(() => ({ status: 'open' as DbStatus }))
vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useDbStatus: () => db.status,
}))

beforeEach(() => {
  pwa.current = undefined
  db.status = 'open'
  reload.mockClear()
})

/** Démarre le store avec un contrôleur initial ; renvoie de quoi simuler attente et activation. */
function startUpdate() {
  const container = makeFakeContainer(true)
  let needRefresh: (() => void) | undefined
  pwaUpdate.start((options) => {
    needRefresh = options.onNeedRefresh
    return () => Promise.resolve()
  }, container)
  return {
    wait: () => act(() => needRefresh?.()),
    activate: () =>
      act(() => {
        container.dispatchEvent(new Event('controllerchange'))
      }),
  }
}

test('la vue projetée, base outdated, se recharge une fois', async () => {
  db.status = 'outdated'
  renderAt('/present/session-1')
  await screen.findByRole('alert')
  expect(reload).toHaveBeenCalledTimes(1)
})

test('la vue projetée ne se recharge pas pour une version seulement en attente', async () => {
  const { wait } = startUpdate()
  renderAt('/present/session-1')
  await screen.findByRole('heading', { name: 'Session introuvable' })
  wait()
  wait()
  expect(reload).not.toHaveBeenCalled()
})

test('la vue projetée se recharge une fois quand la version est activée ailleurs', async () => {
  const { wait, activate } = startUpdate()
  renderAt('/present/session-1')
  await screen.findByRole('heading', { name: 'Session introuvable' })
  wait()
  activate()
  expect(reload).toHaveBeenCalledTimes(1)
})
