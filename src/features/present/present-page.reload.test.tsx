import 'fake-indexeddb/auto'
import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { renderAt } from '@/testing/render-at'

const reloadOnUpdate = vi.hoisted(() => vi.fn<(dbOutdated: boolean) => void>())
vi.mock('@/lib/pwa/hooks', () => ({ useReloadOnUpdate: reloadOnUpdate }))
vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useDbStatus: () => 'outdated',
}))

test('la vue projetée, base outdated, demande le rechargement automatique', async () => {
  renderAt('/present/session-1')
  await screen.findByRole('alert')
  expect(reloadOnUpdate).toHaveBeenCalledWith(true)
})
