import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { buildConfigJsonSchema } from '@/domain/config/json-schema'

type SchemaNode = Record<string, unknown>

function isNode(value: unknown): value is SchemaNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Chemins de tous les champs du JSON Schema : `a.b`, `liste[].champ` ; les variantes gardent le chemin. */
function collectPaths(node: unknown, path: string, out: Set<string>): void {
  if (!isNode(node)) return
  if (path !== '') out.add(path)
  const { properties, items } = node
  if (isNode(properties)) {
    for (const [key, child] of Object.entries(properties)) {
      collectPaths(child, path === '' ? key : `${path}.${key}`, out)
    }
  }
  if (items !== undefined) collectPaths(items, `${path}[]`, out)
  for (const keyword of ['anyOf', 'oneOf', 'allOf']) {
    const variants = node[keyword]
    if (Array.isArray(variants)) {
      for (const variant of variants) collectPaths(variant, path, out)
    }
  }
}

function listSchemaPaths(schema: Record<string, unknown>): string[] {
  const out = new Set<string>()
  collectPaths(schema, '', out)
  return [...out].toSorted()
}

function escapeRegExp(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

const THEME_PATH = /^theme\.(?:light|dark)\.(.+)$/

describe('référence de la config du guide', () => {
  const paths = listSchemaPaths(buildConfigJsonSchema())

  test('le parcours du schéma trouve les champs attendus', () => {
    expect(paths.length).toBeGreaterThanOrEqual(100)
    expect(paths).toContain('exam.title')
    expect(paths).toContain('scoring.rounding.step')
    expect(paths).toContain('categories[].questions[].answer')
    expect(paths).toContain('theme.light.card-foreground')
  })

  test('chaque champ du schéma est documenté dans la référence', () => {
    const page = readFileSync(join(import.meta.dirname, 'reference-config.md'), 'utf8')
    // Un champ compte comme documenté s'il ouvre une ligne de tableau : `| \`chemin\` | …`.
    const missing = paths.filter((path) => {
      const name = THEME_PATH.exec(path)?.[1] ?? path
      const row = new RegExp(String.raw`^\|\s*\`${escapeRegExp(name)}\`\s*\|`, 'm')
      return !row.test(page)
    })
    expect(missing).toEqual([])
  })
})
