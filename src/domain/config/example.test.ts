import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, test } from 'vitest'
import exampleText from '../../../examples/config.example.json?raw'
import { buildConfigJsonSchema, CONFIG_SCHEMA_URL } from './json-schema'
import { validateConfig } from './validate'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Vérifie réellement, niveau par niveau, la forme utilisée par les tests ci-dessous (au lieu
 * d'un cast `as` ou d'un garde qui ne contrôlerait que la racine) : une régression de
 * `buildConfigJsonSchema` qui ferait disparaître un de ces champs échoue ici avec un message
 * précis, plutôt que plus loin avec un `Cannot read properties of undefined` peu clair.
 */
function assertConfigSchemaShape(value: unknown): asserts value is {
  $id: string
  $schema: string
  additionalProperties: boolean
  properties: { categories: { items: { properties: { icon: { anyOf: unknown[] } } } } }
} {
  if (!isRecord(value)) throw new Error('schéma généré : racine non-objet')
  if (typeof value.$id !== 'string') throw new Error('schéma généré : $id absent ou non-string')
  if (typeof value.$schema !== 'string') {
    throw new Error('schéma généré : $schema absent ou non-string')
  }
  if (typeof value.additionalProperties !== 'boolean') {
    throw new Error('schéma généré : additionalProperties absent ou non-booléen')
  }
  if (!isRecord(value.properties)) throw new Error('schéma généré : properties absent')
  if (!isRecord(value.properties.categories)) {
    throw new Error('schéma généré : properties.categories absent')
  }
  if (!isRecord(value.properties.categories.items)) {
    throw new Error('schéma généré : properties.categories.items absent')
  }
  if (!isRecord(value.properties.categories.items.properties)) {
    throw new Error('schéma généré : properties.categories.items.properties absent')
  }
  if (!isRecord(value.properties.categories.items.properties.icon)) {
    throw new Error('schéma généré : properties.categories.items.properties.icon absent')
  }
  if (!Array.isArray(value.properties.categories.items.properties.icon.anyOf)) {
    throw new Error('schéma généré : properties.categories.items.properties.icon.anyOf absent')
  }
}

describe('fichier d’exemple', () => {
  test('passe validateConfig sans erreur ni avertissement', () => {
    const result = validateConfig(exampleText, { cssSupports: () => true })
    expect(result.issues).toEqual([])
    expect(result.ok).toBe(true)
  })

  test('4 catégories de tailles inégales, dont une à 2 questions, et un titre dérivé', () => {
    const result = validateConfig(exampleText, { cssSupports: () => true })
    if (!result.ok) throw new Error('exemple invalide')
    expect(result.config.categories.map((c) => [c.id, c.questions.length])).toEqual([
      ['facile', 5],
      ['normal', 6],
      ['difficile', 4],
      ['cauchemar', 2],
    ])
    expect(result.config.categories[0]?.questions[1]?.title).toBe(
      'Quelle est la différence entre echo et print ?',
    )
    expect(result.config.presentation.defaultColorMode).toBe('dark')
  })

  test('valide le JSON Schema généré (ajv, draft 2020-12)', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    const validate = ajv.compile(buildConfigJsonSchema())
    const valid = validate(JSON.parse(exampleText))
    if (!valid) throw new Error(JSON.stringify(validate.errors))
    expect(valid).toBe(true)
  })
})

describe('buildConfigJsonSchema', () => {
  const schema = buildConfigJsonSchema()
  assertConfigSchemaShape(schema)

  test('porte l’URL publique et le draft 2020-12', () => {
    expect(schema.$id).toBe(CONFIG_SCHEMA_URL)
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(schema.additionalProperties).toBe(false)
  })

  test('icon : enum des noms Tabler ou chaîne libre', () => {
    const iconAnyOf = schema.properties.categories.items.properties.icon.anyOf
    const [names, free] = iconAnyOf
    if (typeof names !== 'object' || names === null || !('enum' in names)) {
      throw new Error('anyOf[0] attendu avec une clé enum')
    }
    expect(names.enum).toContain('brand-php')
    expect(free).toEqual({ type: 'string' })
  })

  test('refuse une clé inconnue et accepte une icône inconnue', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    const validate = ajv.compile(buildConfigJsonSchema())
    const parsed: unknown = JSON.parse(exampleText)
    if (typeof parsed !== 'object' || parsed === null) throw new Error('exemple invalide')
    expect(validate({ ...parsed, extra: 1 })).toBe(false)

    if (!('categories' in parsed)) throw new Error('exemple sans categories')
    const { categories } = parsed
    if (!Array.isArray(categories)) throw new Error('categories devrait être un tableau')
    const [firstCategory] = categories
    if (typeof firstCategory !== 'object' || firstCategory === null || !('icon' in firstCategory)) {
      throw new Error('première catégorie invalide')
    }
    firstCategory.icon = 'licorne'
    expect(validate(parsed)).toBe(true)
  })
})
