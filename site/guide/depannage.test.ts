import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { CONFIG_ISSUE_MESSAGES } from '@/domain/config/messages'
import { CSV_ISSUE_MESSAGES } from '@/domain/students/messages'

const HEADING_ANCHOR = /^#{2,4}\s.*\{#([\w-]+)\}\s*$/gm
const SPAN_ANCHOR = /<span id="([\w-]+)"><\/span>/g

/** Ancres de la page : identifiants personnalisés de titres et `<span id>` posés pour les codes regroupés. */
function listAnchors(page: string): string[] {
  const headings = [...page.matchAll(HEADING_ANCHOR)].map((match) => match[1])
  const spans = [...page.matchAll(SPAN_ANCHOR)].map((match) => match[1])
  return [...headings, ...spans]
}

describe('dépannage du guide', () => {
  const page = readFileSync(join(import.meta.dirname, 'depannage.md'), 'utf8')
  const anchors = listAnchors(page)
  const codes = [...Object.keys(CONFIG_ISSUE_MESSAGES.fr), ...Object.keys(CSV_ISSUE_MESSAGES.fr)]

  test('les dictionnaires fournissent assez de codes', () => {
    expect(codes.length).toBeGreaterThanOrEqual(30)
    expect(new Set(codes).size).toBe(codes.length)
  })

  test('chaque code d’erreur de création a une entrée', () => {
    const missing = codes.filter((code) => !anchors.includes(code))
    expect(missing).toEqual([])
  })

  test('aucune ancre de code n’est dupliquée', () => {
    const duplicated = anchors.filter((anchor, index) => anchors.indexOf(anchor) !== index)
    expect(duplicated).toEqual([])
  })

  test('chaque lien vers le dépannage pointe une ancre existante', () => {
    const dir = import.meta.dirname
    const broken: string[] = []
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
      const text = readFileSync(join(dir, file), 'utf8')
      const targets = [...text.matchAll(/depannage(?:\.html|\.md)?#([\w-]+)/g)].map((m) => m[1])
      if (file === 'depannage.md') {
        targets.push(...[...text.matchAll(/\]\(#([\w-]+)\)/g)].map((m) => m[1]))
      }
      for (const id of targets) if (!anchors.includes(id)) broken.push(`${file}#${id}`)
    }
    expect(broken).toEqual([])
  })
})
