import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const SCREENSHOTS_DIR = join(import.meta.dirname, '..', 'public', 'screenshots')

/** Pages pas encore réécrites pour l'interface de F44 (F44.11) : chaque tâche retire les siennes. */
const PENDING: ReadonlySet<string> = new Set([
])

/** Libellés et parcours d'avant la refonte (F44) : le lecteur chercherait un bouton disparu. */
const OBSOLETE: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  // Seul le nom du fichier exporté garde « -backup- » (`domain/backup/serialize.ts`).
  { label: 'backup au lieu de sauvegarde', pattern: /(?<![-\w])backups?(?![-\w])/i },
  { label: 'carte « Restaurer une session »', pattern: /«\s*Restaurer une session\s*»/ },
  { label: 'carte « Éditer une config »', pattern: /«\s*Éditer une config\s*»/ },
  { label: 'bouton « Commencer »', pattern: /«\s*Commencer\s*»/ },
  { label: 'onglet « Étudiant(s) »', pattern: /onglet\s+«\s*Étudiants?\s*»/ },
  {
    label: 'bascule de mode en haut à droite',
    pattern: /(\bmode\b|bascule)[^.\n]*en haut à droite/i,
  },
  {
    label: 'bascule de mode en haut à droite',
    pattern: /en haut à droite[^.\n]*\bmode\b/i,
  },
]

const SCREENSHOT = /\/screenshots\/([\w-]+\.png)/g

function listPages(): string[] {
  return readdirSync(import.meta.dirname).filter((name) => name.endsWith('.md'))
}

function read(page: string): string {
  return readFileSync(join(import.meta.dirname, page), 'utf8')
}

describe('guide : interface livrée par F44', () => {
  const pages = listPages().filter((page) => !PENDING.has(page))

  test.each(pages)('%s ne cite aucun libellé d’avant la refonte', (page) => {
    const hits: string[] = []
    read(page)
      .split('\n')
      .forEach((line, index) => {
        for (const { label, pattern } of OBSOLETE) {
          if (pattern.test(line)) hits.push(`ligne ${index + 1} : ${label}`)
        }
      })
    expect(hits).toEqual([])
  })

  test.each(pages)('%s ne cite que des captures présentes', (page) => {
    const missing = [...read(page).matchAll(SCREENSHOT)]
      .map((match) => match[1])
      .filter((file) => !existsSync(join(SCREENSHOTS_DIR, file)))
    expect(missing).toEqual([])
  })
})
