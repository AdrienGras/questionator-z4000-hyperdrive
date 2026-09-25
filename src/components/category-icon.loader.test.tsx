import { expect, test, vi } from 'vitest'
import { createIconLoader } from './category-icon'

test('un échec transitoire est retenté au prochain appel', async () => {
  let attempt = 0
  const importIcons = vi.fn<() => Promise<object>>(() => {
    attempt += 1
    return attempt === 1
      ? Promise.reject(new Error('chunk introuvable'))
      : Promise.resolve({ IconBrandPhp: () => null })
  })
  const loadIcons = createIconLoader(importIcons)

  await expect(loadIcons()).resolves.toBeNull()
  const icons = await loadIcons()

  expect(icons).toStrictEqual({ IconBrandPhp: expect.any(Function) })
  expect(importIcons).toHaveBeenCalledTimes(2)
})

test('un succès est mis en cache : les appels suivants ne réimportent pas', async () => {
  const importIcons = vi.fn<() => Promise<object>>(() =>
    Promise.resolve({ IconBrandPhp: () => null }),
  )
  const loadIcons = createIconLoader(importIcons)

  await loadIcons()
  await loadIcons()

  expect(importIcons).toHaveBeenCalledTimes(1)
})
