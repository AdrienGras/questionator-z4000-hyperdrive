import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const ROOT = join(import.meta.dirname, '..')
const BANNER = 'assets/readme-banner.webp'
const STILL = 'assets/readme-banner-still.webp'

/** Plafonds de poids : la bannière se charge à chaque visite du dépôt, y compris sur mobile. */
const MAX_BANNER_BYTES = 5 * 1024 * 1024
const MAX_STILL_BYTES = 200 * 1024

/** En-tête WebP étendu (`VP8X`) : drapeau d'animation et présence d'un bloc `ANIM`. */
function describeWebp(bytes: Buffer): { webp: boolean; animated: boolean } {
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  const extended = bytes.toString('ascii', 12, 16) === 'VP8X'
  const animated = extended && (bytes[20] & 0x02) !== 0 && bytes.includes('ANIM', 0, 'ascii')
  return { webp, animated }
}

function read(path: string): Buffer {
  return readFileSync(join(ROOT, path))
}

describe('bannière du README', () => {
  test('la bannière est un WebP animé sous 5 Mo', () => {
    expect(describeWebp(read(BANNER))).toEqual({ webp: true, animated: true })
    expect(statSync(join(ROOT, BANNER)).size).toBeLessThanOrEqual(MAX_BANNER_BYTES)
  })

  test("l'image fixe est un WebP non animé sous 200 Ko", () => {
    expect(describeWebp(read(STILL))).toEqual({ webp: true, animated: false })
    expect(statSync(join(ROOT, STILL)).size).toBeLessThanOrEqual(MAX_STILL_BYTES)
  })

  test("le README affiche l'image fixe quand le mouvement est réduit", () => {
    const readme = read('README.md').toString('utf8')
    expect(readme).toContain(`<source media="(prefers-reduced-motion: reduce)" srcset="${STILL}">`)
    expect(readme).toMatch(new RegExp(`<img src="${BANNER}" width="800" alt="[^"]{80,}">`))
  })

  test('chaque image citée en HTML par le README existe', () => {
    const readme = read('README.md').toString('utf8')
    const paths = [...readme.matchAll(/(?:src|srcset)="([^"]+)"/g)].map((match) => match[1])
    expect(paths.length).toBeGreaterThanOrEqual(2)
    expect(paths.filter((path) => !existsSync(join(ROOT, path)))).toEqual([])
  })
})
