import { readFileSync } from 'node:fs'
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
    const page = readFileSync('site/guide/reference-config.md', 'utf8')
    const missing = paths.filter((path) => {
      const token = THEME_PATH.exec(path)?.[1]
      return !page.includes(`\`${token ?? path}\``)
    })
    expect(missing).toEqual([])
  })
})
