/**
 * Génère les icônes PNG de la PWA (F17, D72) depuis la source unique `public/icons/icon.svg`.
 * Lancé à la main par `pnpm icons` après une retouche du SVG (pas en CI) ; les PNG sont commités.
 * Rendu par le Chromium de `@playwright/test` (`pnpm exec playwright install chromium`).
 * Exécuté par Node natif (types retirés) : syntaxe effaçable.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ICONS_DIR = fileURLToPath(new URL('../public/icons/', import.meta.url))

/** Fichier produit et côté du carré, en pixels. Le maskable réutilise le même dessin (zone sûre). */
const TARGETS = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
] as const

const svg = readFileSync(`${ICONS_DIR}icon.svg`, 'utf8')
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const { file, size } of TARGETS) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(
      `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    )
    await page.screenshot({
      path: `${ICONS_DIR}${file}`,
      clip: { x: 0, y: 0, width: size, height: size },
    })
    console.log(`${file} (${size} px)`)
  }
} finally {
  await browser.close()
}
