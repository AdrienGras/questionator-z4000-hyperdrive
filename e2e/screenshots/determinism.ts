import { test as base } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/** Graine de l'aléa des captures. */
export const SEED = 72

/** Instant figé des captures. */
export const FROZEN_TIME = new Date('2026-09-15T09:00:00+02:00')

const OUT_DIR = 'site/public/screenshots'

/**
 * Remplace `crypto.getRandomValues` (seule source d'aléa du tirage, `src/domain/passage/random.ts`)
 * par un mulberry32 : même contrat, il remplit le TypedArray reçu et le renvoie.
 */
function seedRandom(seed: number): void {
  let state = seed >>> 0
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (t ^ (t >>> 14)) >>> 0
  }
  const fill = <T extends ArrayBufferView | null>(array: T): T => {
    if (array === null) return array
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength)
    for (let i = 0; i < bytes.length; i += 4) {
      const word = next()
      for (let k = 0; k < 4 && i + k < bytes.length; k++) bytes[i + k] = (word >>> (8 * k)) & 0xff
    }
    return array
  }
  Object.defineProperty(crypto, 'getRandomValues', { value: fill, configurable: true })
}

/** Stockage « persistant » : sans cela, Chromium headless affiche l'alerte « Stockage non garanti » dans l'en-tête. */
function grantPersistentStorage(): void {
  Object.defineProperty(navigator.storage, 'persisted', { value: () => Promise.resolve(true) })
  Object.defineProperty(navigator.storage, 'persist', { value: () => Promise.resolve(true) })
}

/**
 * `test` des captures : aléa gradué, horloge figée sur tout le contexte (donc aussi sur la vue
 * projetée, ouverte dans une nouvelle page).
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(seedRandom, SEED)
    await context.addInitScript(grantPersistentStorage)
    // `setFixedTime` : `Date` figée, mais les minuteries restent réelles (animations, débounces).
    await context.clock.setFixedTime(FROZEN_TIME)
    await use(context)
  },
})

export { expect } from '@playwright/test'

/** Capture `site/public/screenshots/<name>.png` (page entière visible ou élément). */
export async function capture(target: Page | Locator, name: string): Promise<void> {
  await target.screenshot({
    path: `${OUT_DIR}/${name}.png`,
    animations: 'disabled',
    caret: 'hide',
  })
}
