import { describe, expect, test } from 'vitest'
import { CONFIG_DEFAULTS } from './defaults'
import { buildConfigJsonSchema } from './json-schema'

interface Node {
  description?: string
  default?: unknown
  anyOf?: Node[]
  items?: Node
  properties?: Record<string, Node>
}

/** Chemins des propriétés (et nœuds `items`) sans description non vide. */
function missingDescriptions(node: Node, path = ''): string[] {
  const missing: string[] = []
  for (const [key, child] of Object.entries(node.properties ?? {})) {
    const childPath = path === '' ? key : `${path}.${key}`
    if (typeof child.description !== 'string' || child.description.trim() === '') {
      missing.push(childPath)
    }
    missing.push(...missingDescriptions(child, childPath))
  }
  if (node.items) missing.push(...missingDescriptions(node.items, `${path}[]`))
  for (const alternative of node.anyOf ?? [])
    missing.push(...missingDescriptions(alternative, path))
  return missing
}

function root(): Node {
  return buildConfigJsonSchema()
}

function property(node: Node | undefined, key: string): Node {
  const child = node?.properties?.[key]
  if (!child) throw new Error(`propriété absente : ${key}`)
  return child
}

describe('JSON Schema de config : aide à la saisie', () => {
  test('chaque propriété du JSON Schema a une description', () => {
    expect(missingDescriptions(root())).toEqual([])
  })

  test('les défauts publiés égalent CONFIG_DEFAULTS', () => {
    const sections = ['absent', 'skips', 'presentation'] as const
    const rounding = property(property(root(), 'scoring'), 'rounding')
    for (const [key, value] of Object.entries(CONFIG_DEFAULTS.rounding)) {
      expect(property(rounding, key).default).toStrictEqual(value)
    }
    for (const section of sections) {
      for (const [key, value] of Object.entries(CONFIG_DEFAULTS[section])) {
        expect(property(property(root(), section), key).default).toStrictEqual(value)
      }
    }
  })

  test('icon garde sa description à côté de son anyOf', () => {
    const categories = property(root(), 'categories')
    const icon = property(categories.items, 'icon')
    expect(icon.description).toMatch(/Tabler/)
    expect(icon.anyOf).toHaveLength(2)
  })

  test('un jeton de thème a une description générique', () => {
    const theme = property(root(), 'theme')
    expect(property(property(theme, 'light'), 'primary').description).toBe(
      'Variable CSS `--primary` du thème clair.',
    )
    expect(property(property(theme, 'dark'), 'chart-1').description).toBe(
      'Variable CSS `--chart-1` du thème sombre.',
    )
  })
})
